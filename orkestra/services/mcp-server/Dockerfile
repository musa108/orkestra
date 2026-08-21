FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY server.py .
ENV MCP_PORT=8080
EXPOSE 8080
CMD ["python", "-c", "import server; server.mcp.settings.port=8080; server.mcp.run(transport='streamable-http')"]
