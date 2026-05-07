class ApiResponse{
    constructor(statusCode, data, message = "success", source = null) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.status = statusCode < 400;
        this.source = source;
    }
}
export {ApiResponse}