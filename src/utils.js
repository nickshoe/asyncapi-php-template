export class Utils {

    /**
     * 
     * @param {string} string 
     * @returns {string}
     */
    static lowerCaseFirst(string) {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }

    /**
     * 
     * @param {string} string 
     * @returns {string}
     */
    static upperCaseFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

}