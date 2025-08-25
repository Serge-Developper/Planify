// Déclarations de types pour les fonctions Netlify

declare module 'mongoose' {
  export = mongoose;
  export as namespace mongoose;
  
  namespace mongoose {
    interface Connection {
      readyState: number;
      close(): Promise<void>;
    }
    
    interface Model<T> {
      find(filter?: any): Promise<T[]>;
      findById(id: string): Promise<T | null>;
      findOne(filter: any): Promise<T | null>;
      create(data: any): Promise<T>;
      updateOne(filter: any, update: any): Promise<any>;
      deleteOne(filter: any): Promise<any>;
      findByIdAndUpdate(id: string, update: any, options?: any): Promise<T | null>;
      findByIdAndDelete(id: string): Promise<T | null>;
    }
    
    interface Schema {
      // Définition de base du schéma
    }
    
    interface Document {
      _id: any;
      save(): Promise<Document>;
    }
    
    function connect(uri: string, options?: any): Promise<Connection>;
    function model<T>(name: string, schema: Schema): Model<T>;
    function Schema(definition: any, options?: any): Schema;
    namespace Types {
      const ObjectId: any;
    }
  }
  
  const mongoose: typeof mongoose;
  export = mongoose;
}

declare module 'bcryptjs' {
  export function hash(data: string, saltRounds: number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string): any;
  export function decode(token: string): any;
}

declare module 'nodemailer' {
  export function createTransport(options: any): any;
  export interface Transporter {
    sendMail(mailOptions: any): Promise<any>;
  }
}
