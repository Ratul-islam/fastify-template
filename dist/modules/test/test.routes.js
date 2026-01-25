const testFunc = async (app) => {
    app.get("/", async (request, reply) => {
        reply.code(200).send({ message: "jdhsgfjhghjdsg" });
    });
};
export default testFunc;
