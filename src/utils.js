export class Utils {

    /**
     * 
     * @param {string} str 
     * @returns {string}
     */
    static lowerCaseFirst(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    /**
     * 
     * @param {string} str 
     * @returns {string}
     */
    static upperCaseFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * https://stackoverflow.com/questions/54246477/how-to-convert-camelcase-to-snake-case
     * 
     * @param {string} str 
     * @returns {string}
     */
    static camelToSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

}