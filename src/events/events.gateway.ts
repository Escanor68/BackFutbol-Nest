import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Ejemplo de método para notificar reservas en tiempo real
  notifyFieldReservation(fieldId: string, reservation: any) {
    this.server.emit('fieldReserved', { fieldId, reservation });
  }

  // Ejemplo de método para notificar liberación de canchas
  notifyFieldRelease(fieldId: string) {
    this.server.emit('fieldReleased', { fieldId });
  }

  // Ejemplo de suscripción a eventos del cliente
  @SubscribeMessage('joinFieldRoom')
  handleJoinFieldRoom(client: Socket, fieldId: string) {
    client.join(`field_${fieldId}`);
    this.logger.log(`Client ${client.id} joined room: field_${fieldId}`);
  }

  @SubscribeMessage('leaveFieldRoom')
  handleLeaveFieldRoom(client: Socket, fieldId: string) {
    client.leave(`field_${fieldId}`);
    this.logger.log(`Client ${client.id} left room: field_${fieldId}`);
  }
} 