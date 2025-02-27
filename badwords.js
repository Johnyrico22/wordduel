// List of banned words (Expand as needed)
const bannedWords = [
    "fuck", "shit", "bitch", "asshole", "bastard", "dick", "pussy", "cunt", "cock",
    "whore", "slut", "twat", "nigger", "nigga", "faggot", "retard", "douche", "wanker",
    "bollocks", "prick", "shag", "tosser", "arse", "damn", "hell", "crap", "bugger",
    "goddamn", "dumbass", "dipshit", "jackass", "motherfucker", "sonofabitch", "arsehole",
    "knobhead", "bellend", "wank", "minge", "git", "nonce", "spaz", "pillock", "twatface",
    "shithead", "piss", "scrote", "cum", "skank", "slag", "fuckface", "bint", "ho",
    "fucker", "dickhead", "cocksucker", "motherfking", "shitty", "fucktard", "cockhead",
    "dumbfuck", "titty", "boob", "tits", "fuckwad", "jizz", "clit", "tard", "schlong",
    "knobjockey", "wazzock", "bellend", "gash", "arsewipe", "buggeroff"
];

// Function to check if a name contains banned words
function containsBadWord(name) {
    return bannedWords.some(word => name.toLowerCase().includes(word));
}
