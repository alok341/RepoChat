package com.alok.backend.services;

import java.util.List;
import java.util.UUID;

import com.alok.backend.dto.ChatMessageRequest;
import com.alok.backend.dto.ChatMessageResponse;
import com.alok.backend.dto.ChatSessionResponse;
import com.alok.backend.dto.CreateChatSessionRequest;
import com.alok.backend.entity.*;
import com.alok.backend.exceptions.BadRequestException;
import com.alok.backend.exceptions.NotFoundException;
import com.alok.backend.repository.ChatMessageRepository;
import com.alok.backend.repository.ChatSessionRepository;
import com.alok.backend.services.ai.ChatPromptBuilder;
import com.alok.backend.services.ai.ChatStreamHandler;
import com.alok.backend.services.ai.CitationMapper;
import com.alok.backend.services.ai.CodeContextRetriever;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.RequiredArgsConstructor;

/**
 * Chat sessions and the RAG chat pipeline entry point.
 *
 * <p>{@link #streamReply} orchestrates the full flow:
 * validate → save user message → retrieve code context → build prompts → stream AI reply.
 * Each step is implemented in a dedicated class under {@code service.ai}.
 */


@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final RepoService repoService;
    private final CodeContextRetriever codeContextRetriever;
    private final ChatPromptBuilder chatPromptBuilder;
    private final ChatStreamHandler chatStreamHandler;
    private final CitationMapper citationMapper;

    @Transactional
    public ChatSessionResponse createSession(UUID userId, CreateChatSessionRequest request) {
        Repository repo = repoService.requireOwned(request.repositoryId(), userId);
        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository must be indexed before chatting");
        }

        String title = request.title() != null && !request.title().isBlank()
                ? request.title()
                : "Chat with " + repo.getFullName();

        ChatSession session = ChatSession.builder()
                .userId(userId)
                .repositoryId(repo.getId())
                .title(title)
                .build();
        session = chatSessionRepository.save(session);
        return toSessionResponse(session);
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> listSessions(UUID userId, UUID repositoryId) {
        repoService.requireOwned(repositoryId, userId);
        return chatSessionRepository
                .findByUserIdAndRepositoryIdOrderByCreatedAtDesc(userId, repositoryId)
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID userId, UUID sessionId) {
        ChatSession session = requireSession(userId, sessionId);
        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId()).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatSession requireSession(UUID userId, UUID sessionId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new NotFoundException("Chat session not found"));
    }

    /**
     * Starts an SSE stream of the assistant's reply.
     *
     * <p>Deliberately NOT annotated with {@code @Transactional}: the method returns
     * an {@link SseEmitter} immediately while the model streams tokens over many
     * seconds. Holding a DB transaction open for the full stream would pin a
     * connection from the pool for the entire generation duration.
     *
     * <p>The model provider is whatever Spring AI has wired via
     * {@code spring-ai-starter-model-google-genai} — in this project, Gemini.
     */
    public SseEmitter streamReply(UUID userId, UUID sessionId, ChatMessageRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException("Message must not be blank");
        }

        // 1. Validate session + repo
        ChatSession session = requireSession(userId, sessionId);
        Repository repo = repoService.requireOwned(session.getRepositoryId(), userId);
        if (repo.getIndexStatus() != IndexStatus.READY) {
            throw new BadRequestException("Repository is not ready for chat");
        }

        // 2. Persist user message
        ChatMessage userMessage = chatMessageRepository.save(ChatMessage.builder()
                .sessionId(session.getId())
                .role(MessageRole.USER)
                .content(request.content())
                .build());

        // 3. RAG retrieval
        var retrievedContext = codeContextRetriever.retrieve(repo.getId(), request.content());

        // 4. Build prompts — now with current file context
        String systemPrompt = chatPromptBuilder.systemPrompt(repo.getFullName());
        String userPrompt = chatPromptBuilder.userPromptWithFileContext(
                retrievedContext.contextText(),
                request.content(),
                request.currentFilePath(),
                request.currentFileContent()
        );

        // 5. Stream
        return chatStreamHandler.stream(
                session.getId(),
                toMessageResponse(userMessage),
                retrievedContext.citations(),
                systemPrompt,
                userPrompt);
    }

    private ChatSessionResponse toSessionResponse(ChatSession session) {
        return new ChatSessionResponse(
                session.getId(),
                session.getRepositoryId(),
                session.getTitle(),
                session.getCreatedAt());
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }
}