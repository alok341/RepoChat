package com.alok.backend.services.ai;

import com.alok.backend.dto.CitationDto;

import java.util.List;



public record RetrievedContext(
        List<CitationDto> citations,
        String contextText) {
}