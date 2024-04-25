export function normalizeNames(input: string) {
    console.log("> normalizeNames");
    let result = '';

    let searchPattern = new RegExp('(\\w+)(-|\')?', 'g');
    let items: string[] = input.split(searchPattern);

    let camelCaseWord;
    let isMac = false;
    let lowerNext = false;

    for (let item of items) {
        // very specific to manage https://github.com/yannick-beot-sp/vscode-sailpoint-identitynow/issues/73
        if (lowerNext && item !== "") {
            result += item.toLowerCase()
            lowerNext = false;
            continue;
        }
        if (isMac && item === "-") {
            isMac = false
            lowerNext = true
            result += "-"
            continue;
        }

        if ((item !== '') && (item !== undefined)) {
            if (item !== ' ') {
                camelCaseWord = item[0].toUpperCase() + item.substring(1).toLowerCase();
            } else {
                camelCaseWord = ' ';
            }

            if (camelCaseWord.toUpperCase().startsWith('MC')) {
                if (camelCaseWord.length === 2) {
                    isMac = true;
                } else {
                    isMac = false;
                    camelCaseWord = camelCaseWord.substring(0, 2) + camelCaseWord.substring(2, 3).toUpperCase() + camelCaseWord.substring(3);
                }
            } else if (camelCaseWord.toUpperCase().startsWith('MAC')) {
                if (camelCaseWord.length === 3) {
                    isMac = true;
                } else {
                    isMac = false;
                    camelCaseWord = camelCaseWord.substring(0, 3) + camelCaseWord.substring(3, 4).toUpperCase() + camelCaseWord.substring(4);
                }
            } else {
                isMac = false;
            }
            result += camelCaseWord
        }
    }

    let toponymcOrGenerational: string[] = ['VON', 'DEL', 'OF', 'DE', 'LA', 'Y'];

    for (let item of toponymcOrGenerational) {
        searchPattern = new RegExp(`\\b(?=\\w)${item}\\b(?<=\\w)`, 'gi');

        if (result.match(searchPattern)) {
            result = result.replace(searchPattern, item.toLowerCase());
        }
    }

    searchPattern = new RegExp('\\s(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})\\s', 'gi');

    if (result.match(searchPattern)) {
        result = result.replace(searchPattern, x => x.toUpperCase());
    }

    console.log("< normalizeNames. result=" + result);
    return result;
}

