import { FastifyInstance } from "fastify"

const testFunc = async (app: FastifyInstance)=>{
    app.get("/", async (request, reply) => {
        reply.code(200).send({message: "jdhsgfjhghjdsg"})
    })
}


export default testFunc;