import { WebSocket } from "ws";
import config from "../../config";
import { jwtHelpers } from "../../helpers/jwtHelpers";

export function verifyWebSocketToken(ws: WebSocket, token: string) {
  if (!token) {
    sendWsError(ws, "You are not authenticated");
    ws.close();
    return null;
  }

  try {
    const decoded = jwtHelpers.verifyToken(
      token,
      config.jwt.jwt_secret as string,
    );
    return decoded;
  } catch (error: any) {
    let message = "Invalid token!";

    if (error?.name === "TokenExpiredError") {
      message = "Token has expired!";
    }

    sendWsError(ws, message);
    ws.close();
    return null;
  }
}

function sendWsError(ws: WebSocket, message: string) {
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "error", message }));
  }
}
