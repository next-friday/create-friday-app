import {Injectable} from "@nestjs/common";

@Injectable()
export class AppService {
  private readonly greeting = "Hello World!";

  getHello(): string {
    return this.greeting;
  }
}
