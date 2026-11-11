package com.alok.backend.dto;


import jakarta.validation.constraints.NotBlank;
import org.jetbrains.annotations.NotNull;

public record ChatMessageRequest(
        @NotBlank String content, String currentFilePath,      // nullable — the file the user is viewing
        String currentFileContent ) {
}