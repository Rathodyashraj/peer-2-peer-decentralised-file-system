export function getInitials(username = "") {
    return username
        .trim()
        .split(/\s+/)
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}