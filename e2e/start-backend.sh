#!/usr/bin/env bash
# Levanta el backend con datos de demostración sobre una base PostgreSQL descartable
# ("sistematicket_e2e"), recreada en cada corrida. No toca la base de desarrollo.
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-../SistemaTicket-BE}"
CONTENEDOR="${POSTGRES_CONTAINER:-sistematicket-postgres}"
DB="${E2E_DB:-sistematicket_e2e}"

docker exec "$CONTENEDOR" psql -U sistematicket -d postgres -c "DROP DATABASE IF EXISTS $DB" >/dev/null
docker exec "$CONTENEDOR" psql -U sistematicket -d postgres -c "CREATE DATABASE $DB" >/dev/null

# Los tests de Mockito y el arranque se verifican con JDK 21; el JDK por defecto puede ser otro.
if [ -z "${JAVA_HOME:-}" ] && [ -x /usr/libexec/java_home ]; then
  JAVA_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
  export JAVA_HOME
fi

cd "$BACKEND_DIR"
export SISTEMATICKET_DB_URL="jdbc:postgresql://localhost:5432/$DB"
exec mvn -q spring-boot:run -Dspring-boot.run.profiles=demo
