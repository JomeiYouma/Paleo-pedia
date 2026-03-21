import { Octokit } from "octokit";


// Polyfill Buffer for browser environment if needed (Vite usually handles this or we use a different approach)
// For binary data in browser, we often use Uint8Array or ArrayBuffer. Octokit handles it.

class GitHubService {
    constructor() {
        this.octokit = null;
        this.owner = null;
        this.repo = null;
        this.branch = "main"; // default
    }

    initialize(token, owner, repo, branch = "main") {
        this.octokit = new Octokit({ auth: token });
        this.owner = owner;
        this.repo = repo;
        this.branch = branch;
    }

    get isConfigured() {
        return !!this.octokit && !!this.owner && !!this.repo;
    }

    async getFileContent(path) {
        if (!this.isConfigured) return [];
        try {
            const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: this.owner,
                repo: this.repo,
                path: path,
                ref: this.branch
            });

            // GitHub API returns content encoded in base64
            const content = atob(response.data.content);
            return JSON.parse(content);
        } catch (error) {
            if (error.status === 404) return []; // File not found, return empty
            console.error("Error fetching file:", error);
            throw error;
        }
    }

    async returnFileSha(path) {
        if (!this.isConfigured) return null;
        try {
            const response = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner: this.owner,
                repo: this.repo,
                path: path,
                ref: this.branch
            });
            return response.data.sha;
        } catch (e) {
            return null;
        }
    }

    async saveJson(path, data, message = "Update data") {
        if (!this.isConfigured) throw new Error("GitHub Service not configured");

        // Get numeric SHA if file exists
        const sha = await this.returnFileSha(path);

        const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))); // Handle unicode

        await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner: this.owner,
            repo: this.repo,
            path: path,
            message: message,
            content: content,
            sha: sha || undefined,
            branch: this.branch
        });
    }

    async uploadImage(file, path) {
        if (!this.isConfigured) throw new Error("GitHub Service not configured");

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    // content must be base64 string
                    const base64Content = reader.result.split(',')[1];
                    const sha = await this.returnFileSha(path);

                    await this.octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                        owner: this.owner,
                        repo: this.repo,
                        path: path,
                        message: `Upload image: ${path}`,
                        content: base64Content,
                        sha: sha || undefined,
                        branch: this.branch
                    });
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }
}

export const githubService = new GitHubService();
