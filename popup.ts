async function getCurrentUser(): Promise<string | null> {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('github.com')) {
        const parts = new URL(tab.url).pathname.split('/');
        return parts[1]; // First part after / is the username
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

    const { blacklist = [] } = await (chrome.storage.local.get('blacklist') as Promise<{ blacklist?: string[] }>);
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
