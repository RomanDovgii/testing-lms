import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class GatewayService {
  constructor(
    @Inject('AUTHORIZATION_SERVICE') private readonly authorizationClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('TESTING_SERVICE') private readonly testingClient: ClientProxy,
    @Inject('ANALYTIC_SERVICE') private readonly analyticClient: ClientProxy,
  ) {}
}
