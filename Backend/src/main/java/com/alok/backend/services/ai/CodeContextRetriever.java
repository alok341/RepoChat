package com.alok.backend.services.ai;

import com.alok.backend.dto.CitationDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;


@Service
public class CodeContextRetriever {

    private static final String NO_MATCHES = "(no matching code chunks found)";

    private final VectorStore vectorStore;
    private final CitationMapper citationMapper;

    public CodeContextRetriever(VectorStore vectorStore, CitationMapper citationMapper) {
        this.vectorStore = vectorStore;
        this.citationMapper = citationMapper;
    }

    public RetrievedContext retrieve(UUID repositoryId, String question) {
        SearchRequest request;
        try {
            var filter = new FilterExpressionBuilder()
                    .eq(RagSettings.METADATA_REPO_ID, repositoryId.toString())
                    .build();

            request = SearchRequest.builder()
                    .query(question)
                    .topK(RagSettings.TOP_K_CHUNKS)
                    .filterExpression(filter)
                    .build();
        } catch (Exception ex) {
            // If filter construction fails, fall back to unfiltered search
            request = SearchRequest.builder()
                    .query(question)
                    .topK(RagSettings.TOP_K_CHUNKS)
                    .build();
        }

        List<Document> documents;
        try {
            documents = vectorStore.similaritySearch(request);
        } catch (Exception ex) {
            documents = List.of();
        }
        if (documents == null) {
            documents = List.of();
        }

        List<CitationDto> citations = documents.stream()
                .map(citationMapper::fromDocument)
                .filter(Objects::nonNull)
                .filter(c -> c.filePath() != null)
                .collect(Collectors.collectingAndThen(
                        Collectors.toCollection(LinkedHashSet::new),
                        ArrayList::new));

        String contextText = documents.stream()
                .map(Document::getText)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("\n\n---\n\n"));

        if (contextText.isBlank()) {
            contextText = NO_MATCHES;
        }

        return new RetrievedContext(citations, contextText);
    }
}