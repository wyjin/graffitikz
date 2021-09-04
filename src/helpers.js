
export const randString = () => {
    return  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const pointsNeq = (p1, p2) => {
    return p1[0] != p2[0] || p1[1] != p2[1]
}

export const colorsNeq = (c1, c2) => {
    return c1[0] != c2[0] || c1[1] != c2[1] || c1[2] != c2[2] || c1[3] != c2[3]
}

export const pointsDist = (p1, p2) => {
    return Math.sqrt(Math.pow(p1[0] -p2[0], 2) + Math.pow(p1[1]-p2[1], 2))
}

export const getAnchorPoint = (p1, p2, dist) => {
    if (dist < 0.00001) return [...p1]
    const hypotenuse = pointsDist(p1, p2)
    if (hypotenuse < 0.00001) return [...p1]
    const dx = (p2[0] - p1[0]) / hypotenuse * dist
    const dy = (p2[1] - p1[1]) / hypotenuse * dist
    return [p1[0] + dx, p1[1] + dy]
}

export const getMirroredPoint = (p, origin) => {
    return [2 * origin[0] - p[0], 2 * origin[1] - p[1]]
}