import * as Koa from 'koa';
import { Observable } from '@reactivex/rxjs';
import { ParameterMetaCreator, TClassIndefiner, AnnotationDependenciesAutoRegister } from '@flowx/container';
import { HttpServerInjectable } from '../http';
import { PipeLineTransform } from '../transforms';

export function Query(): ParameterDecorator;
export function Query(key: string): ParameterDecorator;
export function Query<C extends Koa.Context, R = any>(key: string, ...piper: TClassIndefiner<PipeLineTransform<string, R>>[]): ParameterDecorator;
export function Query<C extends Koa.Context, R = any>(key?: string | TClassIndefiner<PipeLineTransform<string, any>>, ...piper: TClassIndefiner<PipeLineTransform<any, any>>[]) {
  if (piper && piper.length) {
    piper.forEach(pipe => AnnotationDependenciesAutoRegister(pipe, HttpServerInjectable));
  }
  return ParameterMetaCreator.define<C, R>(async ctx => {
    if (!key) return ctx.query as R;
    if (typeof key === 'string') {
      if (!piper.length) return ctx.query[key] as R;
      const observable = Observable.of(ctx.query[key]);
      const latObservable = piper.reduce((prev, next) => {
        return prev.pipe(source => {
          const target = HttpServerInjectable.get<PipeLineTransform<any, any>>(next);
          return target.transform(source);
        });
      }, observable);
      return await latObservable.toPromise<R>();
    }
  })
}