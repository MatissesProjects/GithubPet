export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const PERSONALITY_PHRASES: Record<string, Record<string, string[]>> = {
    stoic: {
        scared: ["Silence.", "Data void.", "..."],
        happy: ["Objective met.", "Analyzing square.", "Proceeding."],
        ecstatic: ["Optimal performance.", "Data peak detected.", "Efficient."]
    },
    energetic: {
        scared: ["WHERE ARE WE?!", "BOOOORING!", "Let's find some green!"],
        happy: ["GO GO GO!", "ZOOM!", "Commit party!", "Wheeeee!"],
        ecstatic: ["ULTRA SPEED!", "BOOM! MAXIMUM POWER!", "PARTY TIME!"]
    },
    grumpy: {
        scared: ["Ugh, typical.", "What a waste of time.", "Don't look at me."],
        happy: ["Fine, a commit.", "Could be greener.", "Whatever."],
        ecstatic: ["Finally, some effort.", "I guess this is okay.", "Stop staring."]
    },
    philosophical: {
        scared: ["Is a graph without color even a graph?", "Void... like my thoughts.", "The absence of being."],
        happy: ["The green represents growth.", "Commits are the heartbeat of time.", "Existence is a recursive loop."],
        ecstatic: ["Total enlightenment.", "The signature is finally whole.", "I see the code in all things."]
    },
    anxious: {
        scared: ["Oh no oh no oh no.", "I don't like this square.", "Hiding now."],
        happy: ["Is this safe?", "Okay, keep it together.", "Did I miss a semi-colon?"],
        ecstatic: ["TOO MUCH PRESSURE!", "Wait, are we ready for this?!", "AHHH! SUCCESS?!"]
    },
    proud: {
        scared: ["Beneath my dignity.", "I deserve better than this.", "Hmph."],
        happy: ["Behold my contributions.", "Magnificent.", "Simply the best."],
        ecstatic: ["KING OF THE GRAPH!", "None can rival my DNA!", "GLORIOUS!"]
    }
};

export const TITLES = {
    prefixes: ["The Great", "The Ancient", "The Eternal", "The Cosmic", "The Glitched", "The Radiant", "The Shadowed", "The Pixelated"],
    suffixes: ["Architect", "Voyager", "Sentinel", "Guardian", "Wanderer", "Herald", "Observer", "Anomaly"]
};

export const PATROL_CONFIG = {
    baseInterval: 5000,
    randomVariance: 2000,
    moveDuration: 1000, // ms, should match CSS transition
    speechProbability: 0.8,
    futureLimitDays: 4
};
