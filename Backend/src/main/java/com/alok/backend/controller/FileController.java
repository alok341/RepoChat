package com.alok.backend.controller;


import com.alok.backend.services.UserService;
import com.alok.backend.repository.RepositoryRepository;
import com.alok.backend.exceptions.NotFoundException;
import com.alok.backend.services.github.GithubApiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/repos/{repoId}/files")
@RequiredArgsConstructor
public class FileController {

    private final RepositoryRepository repositoryRepository;
    private final GithubApiClient githubApiClient;
    private final UserService userService;
    private final com.alok.backend.security.CurrentUser currentUser;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getFileTree(@PathVariable UUID repoId) {
        UUID userId = currentUser.require().getId();
        var repo = repositoryRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));

        String token = userService.decryptAccessToken(userService.requiredById(userId));
        Map<String, Object> tree = githubApiClient.getRepoTree(
                token, repo.getOwner(), repo.getName(), repo.getDefaultBranch());

        if (tree == null || tree.get("tree") == null) {
            return ResponseEntity.ok(List.of());
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entries = (List<Map<String, Object>>) tree.get("tree");

        List<Map<String, Object>> files = entries.stream()
                .filter(e -> "blob".equals(String.valueOf(e.get("type"))))
                .map(e -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("path", String.valueOf(e.get("path")));
                    m.put("size", e.get("size") instanceof Number n ? n.longValue() : 0L);
                    return m;
                })
                .toList();

        return ResponseEntity.ok(files);
    }
    @GetMapping("/content")
    public ResponseEntity<Map<String, String>> getFileContent(
            @PathVariable UUID repoId,
            @RequestParam String path) {
        UUID userId = currentUser.require().getId();
        var repo = repositoryRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));

        String token = userService.decryptAccessToken(userService.requiredById(userId));
        String content = githubApiClient.getFileContent(
                token, repo.getOwner(), repo.getName(), path);

        if (content == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
                "path", path,
                "content", content
        ));
    }
}