import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler):Observable<any>{
        return next.handle().pipe(
            map((response) => {
                if(!response){
                    return {data: null};
                }

                if(response.data && response.meta){
                    return response;
                }

                return {data: response};
        }));
    }
}