import { FastifyRequest, FastifyReply } from 'fastify';
import { generateAdminChatResponse, ChatMessage } from '../services/chat';

export async function adminChatHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as { messages?: unknown };

    if (!body || typeof body !== 'object') {
      return reply.status(400).send({
        error: 'Request body must be a valid JSON object.',
      });
    }

    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({
        error: 'messages array is required and must not be empty.',
      });
    }

    for (let i = 0; i < messages.length; i++) {
      const item = messages[i];
      if (!item || typeof item !== 'object') {
        return reply.status(400).send({
          error: `Message at index ${i} must be a valid object.`,
        });
      }

      const { role, content } = item as { role?: unknown; content?: unknown };

      if (role !== 'user' && role !== 'assistant') {
        return reply.status(400).send({
          error: `Message at index ${i} has invalid role. Expected 'user' or 'assistant'.`,
        });
      }

      if (typeof content !== 'string') {
        return reply.status(400).send({
          error: `Message at index ${i} has invalid content. Expected string.`,
        });
      }
    }

    const replyText = await generateAdminChatResponse(messages as ChatMessage[]);

    const chunk = JSON.stringify({
      choices: [
        {
          delta: { content: replyText },
          message: { content: replyText },
        },
      ],
    });

    const sseFormattedResponse = `data: ${chunk}\n\ndata: [DONE]\n\n`;

    return reply
      .header('Content-Type', 'text/event-stream; charset=utf-8')
      .header('Cache-Control', 'no-cache')
      .send(sseFormattedResponse);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('adminChatHandler error:', message);
    return reply.status(500).send({
      error: message || 'Failed to process chat request.',
    });
  }
}
