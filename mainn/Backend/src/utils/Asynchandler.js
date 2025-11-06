export const asyncHandler=(requestHandler) => {
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res))
        .catch(err=>{
            next(err)//Catcing the error and sending it to next middleware or controller 
        })
    }
}