import datetime as dt
import hashlib
import random
import string
from typing import Any, Optional, Sequence

from app.database import get_pool


def _gen_ticket_number() -> str:
    # e.g., AST-20261114-AB12
    date = dt.datetime.utcnow().strftime("%Y%m%d")
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"AST-{date}-{suffix}"


async def create_ticket(user_id: str, user_name: str, subject: str, category: str, description: str) -> int:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # Ensure unique ticket_number
            for _ in range(5):
                ticket_number = _gen_ticket_number()
                try:
                    await cur.execute(
                        """
                        INSERT INTO support_tickets (ticket_number, user_id, user_name, subject, category)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (ticket_number, user_id, user_name, subject, category),
                    )
                    ticket_id = cur.lastrowid
                    break
                except Exception:
                    # collision – retry
                    continue
            else:
                raise RuntimeError("Konnte keine eindeutige Ticketnummer erzeugen")

            await cur.execute(
                """
                INSERT INTO support_ticket_messages (ticket_id, author_id, author_name, is_admin, message)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (ticket_id, user_id, user_name, 0, description),
            )
            return int(ticket_id)


async def get_ticket_owner(ticket_id: int) -> Optional[str]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT user_id FROM support_tickets WHERE id=%s", (ticket_id,))
            row = await cur.fetchone()
            return row[0] if row else None


async def get_ticket_detail(ticket_id: int) -> Optional[dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT id, ticket_number, user_id, user_name, subject, category, status,
                       DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ'),
                       DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%sZ'),
                       IFNULL(DATE_FORMAT(closed_at,'%Y-%m-%dT%H:%i:%sZ'), NULL)
                FROM support_tickets WHERE id=%s
                """,
                (ticket_id,),
            )
            t = await cur.fetchone()
            if not t:
                return None

            await cur.execute(
                """
                SELECT id, author_id, author_name, is_admin, message,
                       DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ')
                FROM support_ticket_messages WHERE ticket_id=%s ORDER BY created_at ASC
                """,
                (ticket_id,),
            )
            msgs = await cur.fetchall()
            return {
                "id": t[0],
                "ticket_number": t[1],
                "user_id": t[2],
                "user_name": t[3],
                "subject": t[4],
                "category": t[5],
                "status": t[6],
                "created_at": t[7],
                "updated_at": t[8],
                "closed_at": t[9],
                "messages": [
                    {
                        "id": m[0],
                        "author_id": m[1],
                        "author_name": m[2],
                        "is_admin": bool(m[3]),
                        "message": m[4],
                        "created_at": m[5],
                    }
                    for m in msgs
                ],
            }


async def list_user_tickets(user_id: str, offset: int = 0, limit: int = 50) -> Sequence[tuple]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT id, ticket_number, user_id, user_name, subject, category, status,
                       DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ'),
                       DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%sZ')
                FROM support_tickets
                WHERE user_id=%s
                ORDER BY updated_at DESC
                LIMIT %s OFFSET %s
                """,
                (user_id, int(limit), int(offset)),
            )
            return await cur.fetchall()


async def list_all_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
) -> Sequence[tuple]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            where = []
            params: list[Any] = []
            if status:
                where.append("status=%s")
                params.append(status)
            if category:
                where.append("category=%s")
                params.append(category)
            if search:
                where.append("(ticket_number LIKE %s OR user_name LIKE %s OR subject LIKE %s)")
                like = f"%{search}%"
                params.extend([like, like, like])
            where_sql = (" WHERE " + " AND ".join(where)) if where else ""
            sql = f"""
                SELECT id, ticket_number, user_id, user_name, subject, category, status,
                       DATE_FORMAT(created_at,'%Y-%m-%dT%H:%i:%sZ'),
                       DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%sZ')
                FROM support_tickets
                {where_sql}
                ORDER BY updated_at DESC
                LIMIT %s OFFSET %s
            """
            params.extend([int(limit), int(offset)])
            await cur.execute(sql, params)
            return await cur.fetchall()


async def add_message(ticket_id: int, author_id: str, author_name: str, is_admin: bool, message: str) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO support_ticket_messages (ticket_id, author_id, author_name, is_admin, message)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (ticket_id, author_id, author_name, 1 if is_admin else 0, message),
            )
            await cur.execute("UPDATE support_tickets SET updated_at=NOW() WHERE id=%s", (ticket_id,))


async def set_status(ticket_id: int, status: str) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            if status == "closed":
                await cur.execute(
                    "UPDATE support_tickets SET status=%s, closed_at=NOW(), updated_at=NOW() WHERE id=%s",
                    (status, ticket_id),
                )
            else:
                await cur.execute(
                    "UPDATE support_tickets SET status=%s, closed_at=NULL, updated_at=NOW() WHERE id=%s",
                    (status, ticket_id),
                )


async def counters() -> dict[str, int]:
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute("SELECT COUNT(*) FROM support_tickets")
            total = (await cur.fetchone())[0]
            res: dict[str, int] = {"total": int(total)}
            for s in ("open", "in_progress", "resolved", "closed"):
                await cur.execute("SELECT COUNT(*) FROM support_tickets WHERE status=%s", (s,))
                res[s] = int((await cur.fetchone())[0])
            return res
