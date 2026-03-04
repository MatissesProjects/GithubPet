async function getCurrentUser(): Promise<string | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (tab && tab.url) {
        try {
            const url = new URL(tab.url);
            if (url.hostname === 'github.com') {
                const parts = url.pathname.split('/').filter(p => p.length > 0);
                if (parts.length > 0) {
                    const firstPart = parts[0];
                    // Skip reserved keywords
                    const reserved = ['settings', 'orgs', 'organizations', 'notifications', 'search', 'explore', 'marketplace', 'trending'];
                    if (!reserved.includes(firstPart)) {
                        return firstPart;
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse URL", e);
        }
    }
    return null;
}

async function updateUI(): Promise<void> {
    const user = await getCurrentUser();
    const statusEl = document.getElementById('status');
    const toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement;

    if (!statusEl || !toggleBtn) return;

    if (!user) {
        statusEl.textContent = 'Not on GitHub profile';
        toggleBtn.disabled = true;
        return;
    }

    toggleBtn.disabled = false;
    const { blacklist = [] } = await (chrome.storage.local.get('blacklist') as any);
    const isBlacklisted = blacklist.includes(user);

    statusEl.textContent = isBlacklisted ? `Disabled for ${user}` : `Enabled for ${user}`;
    toggleBtn.textContent = isBlacklisted ? 'Enable' : 'Disable';
    
    toggleBtn.onclick = async () => {
        let newBlacklist: string[];
        if (isBlacklisted) {
            newBlacklist = blacklist.filter(u => u !== user);
        } else {
            newBlacklist = [...blacklist, user];
        }
        await chrome.storage.local.set({ blacklist: newBlacklist });
        updateUI();
    };
}

updateUI();
