async function getCurrentUser() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('github.com')) {
        const parts = new URL(tab.url).pathname.split('/');
        return parts[1]; // First part after / is the username
    }
    return null;
}

async function updateUI() {
    const user = await getCurrentUser();
    if (!user) {
        document.getElementById('status').textContent = 'Not on GitHub profile';
        document.getElementById('toggle-btn').disabled = true;
        return;
    }

    const { blacklist = [] } = await chrome.storage.local.get('blacklist');
    const isBlacklisted = blacklist.includes(user);

    document.getElementById('status').textContent = isBlacklisted ? `Disabled for ${user}` : `Enabled for ${user}`;
    document.getElementById('toggle-btn').textContent = isBlacklisted ? 'Enable' : 'Disable';
    
    document.getElementById('toggle-btn').onclick = async () => {
        let newBlacklist;
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
