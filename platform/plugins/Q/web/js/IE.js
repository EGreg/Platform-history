if(!Function.prototype.name){
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
            Object.defineProperty(this, 'name', { value: name });
            return name;
        }
    });
}