export default function blankPersonality(personalityObj) {
    const newPersonality = Object.assign({},personalityObj)

    Object.keys(newPersonality).forEach(key => newPersonality[key] = 0)

    return newPersonality
}