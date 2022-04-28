export const ATTRIBUTES:any = {
    'accountAttribute': { 
        'required': ['sourceName', 'attributeName'],
        'optional': ['requiresPeriodicRefresh', 'accountSortAttribute', 'accountSortDescending', 'accountReturnFirstLink', 'accountFilter', 'accountPropertyFilter']
    },
    'base64Decode': { 
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'base64Encode': { 
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'concat': { 
        'required': ['values'],
        'optional': ['requiresPeriodicRefresh']
    },
    'conditional': { 
        'required': ['expression', 'positiveCondition', 'negativeCondition'],
        'optional': ['requiresPeriodicRefresh']
    },
    'dateCompare': { 
        'required': ['firstDate', 'secondDate', 'operator', 'positiveCondition', 'negativeCondition'],
        'optional': ['requiresPeriodicRefresh']
    },
    'dateFormat': { 
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'inputFormat', 'outputFormat', 'input']
    },
    'dateMath': { 
        'required': ['expression'],
        'optional': ['requiresPeriodicRefresh', 'roundUp', 'input']
    },
    'decomposeDiacriticalMarks': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'e164phone': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input', 'defaultRegion']
    },
    'firstValid': {
        'required': ['values'],
        'optional': ['requiresPeriodicRefresh', 'ignoreErrors']
    },
    'identityAttribute': {
        'required': ['name'],
        'optional': ['requiresPeriodicRefresh']
    },
    'indexOf': {
        'required': ['substring'],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'iso3166': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'format', 'input']
    },
    'lastIndexOf': {
        'required': ['substring'],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'leftPad': {
        'required': ['length'],
        'optional': ['requiresPeriodicRefresh', 'padding', 'input']
    },
    'lookup': {
        'required': ['table'],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'lower': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'normalizeNames': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'randomAlphaNumeric': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'length']
    },
    'randomNumeric': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'length']
    },
    'reference': {
        'required': ['id'],
        'optional': ['requiresPeriodicRefresh', 'length']
    },
    'replaceAll': {
        'required': ['MISSING'],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'replace': {
        'required': ['regex', 'replacement'],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'rightPad': {
        'required': ['length'],
        'optional': ['requiresPeriodicRefresh', 'padding', 'input']
    },
    'rule': {
        'required': ['name'],
        'optional': ['MISSING', 'requiresPeriodicRefresh']
    },
    'split': {
        'required': ['delimiter', 'index'],
        'optional': ['requiresPeriodicRefresh', 'throws', 'input']
    },
    'static': {
        'required': ['value'],
        'optional': ['requiresPeriodicRefresh', 'ignoreErrors']
    },
    'substring': {
        'required': ['begin'],
        'optional': ['requiresPeriodicRefresh', 'beginOffset', 'end', 'endOffset', 'input']
    },
    'trim': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'upper': {
        'required': [],
        'optional': ['requiresPeriodicRefresh', 'input']
    },
    'usernameGenerator': {
        'required': ['type', 'patterns'],
        'optional': ['sourceCheck']
    },
    'uuid': {
        'required': [],
        'optional': ['requiresPeriodicRefresh']
    }
};