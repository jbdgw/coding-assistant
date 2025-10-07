#!/bin/bash

# ChromaDB Docker Management Script

case "$1" in
  start)
    echo "🚀 Starting ChromaDB..."
    if docker ps -a --format '{{.Names}}' | grep -q '^chromadb$'; then
      if docker ps --format '{{.Names}}' | grep -q '^chromadb$'; then
        echo "✅ ChromaDB is already running"
      else
        docker start chromadb
        echo "✅ ChromaDB started"
      fi
    else
      docker run -d --name chromadb -p 8000:8000 chromadb/chroma
      echo "✅ ChromaDB container created and started"
    fi
    ;;

  stop)
    echo "🛑 Stopping ChromaDB..."
    docker stop chromadb
    echo "✅ ChromaDB stopped"
    ;;

  restart)
    echo "🔄 Restarting ChromaDB..."
    docker restart chromadb
    echo "✅ ChromaDB restarted"
    ;;

  status)
    if docker ps --format '{{.Names}}' | grep -q '^chromadb$'; then
      echo "✅ ChromaDB is running"
      curl -s http://localhost:8000/api/v2/heartbeat > /dev/null && echo "   API is accessible at http://localhost:8000"
    else
      echo "❌ ChromaDB is not running"
    fi
    ;;

  logs)
    docker logs -f chromadb
    ;;

  remove)
    echo "🗑️  Removing ChromaDB container..."
    docker stop chromadb 2>/dev/null
    docker rm chromadb 2>/dev/null
    echo "✅ ChromaDB container removed"
    ;;

  *)
    echo "ChromaDB Docker Management"
    echo ""
    echo "Usage: ./chromadb.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start ChromaDB container"
    echo "  stop     - Stop ChromaDB container"
    echo "  restart  - Restart ChromaDB container"
    echo "  status   - Check if ChromaDB is running"
    echo "  logs     - Show ChromaDB logs"
    echo "  remove   - Remove ChromaDB container"
    ;;
esac
