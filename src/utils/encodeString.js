import zeroPad from './zeroPad.js';

export default (s) => {
    var nums = '';
    for(var i=0; i<s.length; i++) {
        nums += zeroPad(s.charCodeAt(i), 3);
    }
    return nums;
}
