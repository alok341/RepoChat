package com.alok.backend.services.ai;

import org.springframework.stereotype.Component;

/**
 * Builds the prompts sent to OpenAI.
 *
 * <p>We use two messages:
 * <ul>
 *   <li><b>System</b> — rules for how the assistant should behave</li>
 *   <li><b>User</b> — retrieved code context + the actual question</li>
 * </ul>
 */

@Component
public class ChatPromptBuilder {

    public String systemPrompt(String repositoryFullName) {
        return """
            You are RepoChat, an expert assistant for the %s codebase.
            
            Guidelines:
            - Answer using the provided file context and retrieved code.
            - If the user is viewing a specific file, prioritize that file in your answer.
            - If the context is insufficient, say you are unsure — never hallucinate.
            - Cite file paths and line ranges when relevant.
            - Be concise and technical. Use code blocks for code snippets.
            """.formatted(repositoryFullName);
    }

    public String userPrompt(String codeContext, String question) {
        return """
                Code context:
                %s

                User question:
                %s
                """.formatted(codeContext, question);
    }
    public String userPromptWithFileContext(
            String codeContext,
            String question,
            String currentFilePath,
            String currentFileContent) {

        StringBuilder sb = new StringBuilder();

        // Only include file context if it's actually provided
        if (currentFilePath != null && currentFileContent != null && !currentFileContent.isBlank()) {
            String truncated = currentFileContent.length() > 30000
                    ? currentFileContent.substring(0, 30000) + "\n... [truncated]"
                    : currentFileContent;

            sb.append("The user is currently viewing this file:\n")
                    .append("Path: ").append(currentFilePath).append("\n")
                    .append("```\n")
                    .append(truncated)
                    .append("\n```\n\n");
        }

        sb.append("Additional relevant code retrieved from the repository:\n\n")
                .append(codeContext)
                .append("\n\n---\n\n")
                .append("User question:\n")
                .append(question);

        return sb.toString();
    }
}