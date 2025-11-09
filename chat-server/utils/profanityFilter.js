const badWords = [
    'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard', 
    'crap', 'piss', 'dick', 'cock', 'pussy', 'slut', 'whore',
    'fag', 'nigger', 'retard', 'gay', 'stupid', 'idiot', 'moron',
    'dumb', 'hate', 'kill', 'die', 'suck', 'loser', 'ugly'
];

const profanityFilter = (text) => {
    if (!text || typeof text !== 'string') {
        return text;
    }

    let filteredText = text;
    
    badWords.forEach(badWord => {
        const regex = new RegExp(`\\b${badWord}\\b`, 'gi');
        filteredText = filteredText.replace(regex, 'I LOVE MY MOMMY');
    });

    return filteredText;
};

export default profanityFilter;