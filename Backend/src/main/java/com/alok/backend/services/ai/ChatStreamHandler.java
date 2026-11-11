package com.alok.backend.services.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.alok.backend.dto.ChatMessageResponse;
import com.alok.backend.dto.CitationDto;
import com.alok.backend.entity.ChatMessage;
import com.alok.backend.entity.MessageRole;
import com.alok.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Generation step: call OpenAI via Spring AI and stream tokens to the browser over SSE.
 */

import reactor.core.Disposable;
import reactor.core.publisher.Flux;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;

    /**
     * Built once and reused. Provider-agnostic: works with Gemini, OpenAI, etc.
     * because {@link ChatModel} is injected from the configured Spring AI starter.
     */
    private ChatClient chatClient;

    private ChatClient client() {
        if (chatClient == null) {
            chatClient = ChatClient.builder(chatModel).build();
        }
        return chatClient;
    }

    public SseEmitter stream(
            UUID sessionId,
            ChatMessageResponse savedUserMessage,
            List<CitationDto> citations,
            String systemPrompt,
            String userPrompt) {

        SseEmitter emitter = new SseEmitter(RagSettings.STREAM_TIMEOUT_MS);
        StringBuilder fullReply = new StringBuilder();
        AtomicBoolean closed = new AtomicBoolean(false);

        // Dispose the upstream Flux if the client disconnects — prevents burning
        // Gemini quota on tokens nobody will read.
        final Disposable[] subscription = new Disposable[1];
        emitter.onCompletion(() -> dispose(subscription));
        emitter.onTimeout(() -> {
            dispose(subscription);
            closed.set(true);
            emitter.complete();
        });
        emitter.onError(err -> {
            dispose(subscription);
            closed.set(true);
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("user_message")
                    .data(savedUserMessage));
        } catch (Exception ex) {
            log.warn("Failed to send initial user_message for session {}", sessionId, ex);
            emitter.completeWithError(ex);
            return emitter;
        }

        try {
            Flux<String> tokens = client()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .stream()
                    .content();

            subscription[0] = tokens
                    .doOnNext(token -> {
                        if (token == null || closed.get()) {
                            return;
                        }
                        fullReply.append(token);
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("token")
                                    .data(token, MediaType.APPLICATION_JSON));
                        } catch (Exception ex) {
                            // Client probably went away. Stop the stream.
                            closed.set(true);
                            log.debug("SSE send failed, stopping stream", ex);
                            throw new IllegalStateException(ex);
                        }
                    })
                    .doOnError(err -> {
                        if (closed.getAndSet(true)) {
                            return;
                        }
                        log.error("Chat stream error for session {}", sessionId, err);
                        try {
                            // Send a clean error to the frontend so it doesn't hang
                            String errorMsg = err.getMessage().contains("503")
                                    ? "Google Gemini is currently overloaded. Please try again in a few seconds."
                                    : "An error occurred while generating the response.";

                            emitter.send(SseEmitter.event()
                                    .name("error")
                                    .data("{\"message\":\"" + errorMsg + "\"}", MediaType.APPLICATION_JSON));
                        } catch (Exception ignored) {
                            // Ignore if emitter is already closed
                        }
                        // Don't call completeWithError here, just complete cleanly
                        emitter.complete();
                    })
                    .doOnComplete(() -> {
                        if (closed.getAndSet(true)) {
                            return;
                        }
                        completeStream(emitter, sessionId, fullReply, citations);
                    })
                    .subscribe();
        } catch (Exception ex) {
            log.error("Failed to start stream for session {}", sessionId, ex);
            closed.set(true);
            emitter.completeWithError(ex);
        }

        return emitter;
    }

    private void completeStream(
            SseEmitter emitter,
            UUID sessionId,
            StringBuilder fullReply,
            List<CitationDto> citations) {
        try {
            ChatMessage assistant = chatMessageRepository.save(ChatMessage.builder()
                    .sessionId(sessionId)
                    .role(MessageRole.ASSISTANT)
                    .content(fullReply.toString())
                    .citations(citationMapper.toJson(citations))
                    .build());

            emitter.send(SseEmitter.event()
                    .name("assistant_message")
                    .data(toMessageResponse(assistant)));
            emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            emitter.complete();
        } catch (Exception ex) {
            log.error("Failed to persist/emit assistant message for session {}", sessionId, ex);
            emitter.completeWithError(ex);
        }
    }

    private static void dispose(Disposable[] holder) {
        Disposable d = holder[0];
        if (d != null && !d.isDisposed()) {
            try {
                d.dispose();
            } catch (Exception ignored) {
                // best-effort
            }
        }
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