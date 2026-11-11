package com.alok.backend.services.indexing;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


import com.alok.backend.services.ai.RagSettings;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CodeChunker {

    private final TokenTextSplitter splitter;
    private final CodeFileFilter fileFilter;

    public CodeChunker(
            @Value("${app.indexing.chunk-size:800}") int chunkSize,
            @Value("${app.indexing.chunk-overlap:100}") int chunkOverlap,
            CodeFileFilter fileFilter) {

        int chunkTokens = Math.max(50, chunkSize / 4);
        int minChunkChars = Math.max(10, chunkOverlap);

        this.splitter = TokenTextSplitter.builder()
                .withChunkSize(chunkTokens)
                .withMinChunkSizeChars(minChunkChars)
                .withKeepSeparator(true)
                .build();
        this.fileFilter = fileFilter;
    }

    public List<Document> chunkFile(String repoId, String filePath, String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        String language = fileFilter.detectLanguage(filePath);
        String header = "// File: " + filePath + "\n";
        String fullText = header + content;

        Document source = new Document(fullText, baseMetadata(repoId, filePath, language));
        List<Document> split = splitter.apply(List.of(source));

        return attachLineRanges(split, fullText, repoId, filePath, language);
    }

    private List<Document> attachLineRanges(
            List<Document> chunks,
            String fullText,
            String repoId,
            String filePath,
            String language) {

        List<Document> result = new ArrayList<>(chunks.size());
        int searchFrom = 0;

        for (int i = 0; i < chunks.size(); i++) {
            Document chunk = chunks.get(i);
            String text = chunk.getText();
            if (text == null) {
                text = "";
            }

            int startIdx = fullText.indexOf(text, searchFrom);
            if (startIdx < 0) {
                startIdx = fullText.indexOf(text);
            }
            int endIdx = startIdx < 0 ? -1 : startIdx + text.length();

            Integer startLine = startIdx < 0 ? null : lineOf(fullText, startIdx);
            Integer endLine = endIdx <= 0 ? null : lineOf(fullText, endIdx - 1);

            if (startIdx >= 0) {
                searchFrom = endIdx;
            }

            Map<String, Object> metadata = new HashMap<>(chunk.getMetadata());
            metadata.put(RagSettings.METADATA_REPO_ID, repoId);
            metadata.put("filePath", filePath);
            metadata.put("language", language);
            metadata.put("chunkIndex", i);
            if (startLine != null) {
                metadata.put("startLine", startLine);
            }
            if (endLine != null) {
                metadata.put("endLine", endLine);
            }

            result.add(new Document(text, metadata));
        }

        return result;
    }

    private static int lineOf(String text, int offset) {
        if (offset <= 0) {
            return 1;
        }
        int line = 1;
        int bound = Math.min(offset, text.length());
        for (int i = 0; i < bound; i++) {
            if (text.charAt(i) == '\n') {
                line++;
            }
        }
        return line;
    }

    private static Map<String, Object> baseMetadata(String repoId, String filePath, String language) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(RagSettings.METADATA_REPO_ID, repoId);
        metadata.put("filePath", filePath);
        metadata.put("language", language);
        return metadata;
    }
}