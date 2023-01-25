export default (n, w) => {
    while(n.toString().length<w) n = '0' + n;
    return n;
}
