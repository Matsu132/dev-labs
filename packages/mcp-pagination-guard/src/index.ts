export type Page<T>={items:readonly T[];nextCursor?:string};
export type Limits={maxPages?:number;maxItems?:number};
export class PaginationError extends Error {
 constructor(public readonly code:'CURSOR_CYCLE'|'PAGE_LIMIT'|'ITEM_LIMIT'|'DUPLICATE_ID'|'INVALID_PAGE'){super(code);this.name='PaginationError';}
}
/** Collect a complete catalog before publishing it. Cursors are opaque and never logged. */
export async function collectCatalog<T>(fetchPage:(cursor?:string)=>Promise<Page<T>>,identity:(item:T)=>string,limits:Limits={}):Promise<T[]>{
 const maxPages=limits.maxPages??100,maxItems=limits.maxItems??10000;
 if(!Number.isSafeInteger(maxPages)||maxPages<1||!Number.isSafeInteger(maxItems)||maxItems<1)throw new RangeError('Invalid limits');
 const cursors=new Set<string>(),ids=new Set<string>(),items:T[]=[];
 let cursor:string|undefined;
 for(let page=0;page<maxPages;page++){
  const result=await fetchPage(cursor);
  if(!result||!Array.isArray(result.items)||(result.nextCursor!==undefined&&typeof result.nextCursor!=='string'))throw new PaginationError('INVALID_PAGE');
  if(result.items.length>maxItems-items.length)throw new PaginationError('ITEM_LIMIT');
  for(const item of result.items){const id=identity(item);if(typeof id!=='string'||!id.length)throw new PaginationError('INVALID_PAGE');if(ids.has(id))throw new PaginationError('DUPLICATE_ID');ids.add(id);items.push(item);}
  if(result.nextCursor===undefined)return items;
  if(cursors.has(result.nextCursor))throw new PaginationError('CURSOR_CYCLE');
  cursors.add(result.nextCursor);cursor=result.nextCursor;
 }
 throw new PaginationError('PAGE_LIMIT');
}
