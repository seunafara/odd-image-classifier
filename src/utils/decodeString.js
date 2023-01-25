export default (nums) => {
    var s = '';
    for(var i=0; i<nums.length; i+=3){
        s += String.fromCharCode(nums.substring(i, i+3));
    }
    return s;
}
