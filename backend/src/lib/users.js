const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  handle: true,
  previousHandle: true,
  bio: true,
  avatar: true,
  role: true,
  isBanned: true,
  bannedAt: true,
  bannedReason: true,
  handleChangedAt: true,
  createdAt: true,
};

const PUBLIC_AUTHOR_SELECT = {
  id: true,
  name: true,
  handle: true,
  previousHandle: true,
  bio: true,
  avatar: true,
  createdAt: true,
};

const HANDLE_RE = /^[a-z0-9_-]{3,24}$/;

const normalizeHandle = (input) => String(input || '')
  .trim()
  .toLowerCase()
  .replace(/^@+/, '')
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9_-]/g, '');

const isValidHandle = (handle) => HANDLE_RE.test(handle);

const buildHandleReservationWhere = (handle, excludeUserId) => {
  const clauses = [{ handle }, { previousHandle: handle }];
  if (!excludeUserId) return { OR: clauses };
  return {
    AND: [
      { id: { not: excludeUserId } },
      { OR: clauses },
    ],
  };
};

const isHandleReserved = async (prisma, handle, excludeUserId) => {
  const match = await prisma.user.findFirst({
    where: buildHandleReservationWhere(handle, excludeUserId),
    select: { id: true },
  });
  return !!match;
};

const findUserByHandle = async (prisma, handle, select = AUTH_USER_SELECT) => prisma.user.findFirst({
  where: {
    OR: [
      { handle },
      { previousHandle: handle },
    ],
  },
  select,
});

const buildUniqueHandle = async (prisma, seed, excludeUserId) => {
  const base = normalizeHandle(seed) || `user-${Math.random().toString(36).slice(2, 8)}`;
  let candidate = base;
  let counter = 1;

  while (await isHandleReserved(prisma, candidate, excludeUserId)) {
    candidate = `${base}-${counter++}`;
  }

  return candidate;
};

const ensureAdminBootstrap = async (prisma, preferredUserId) => {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  });
  if (existingAdmin) return existingAdmin.id;

  const bootstrapTarget = preferredUserId
    ? await prisma.user.findUnique({
        where: { id: preferredUserId },
        select: { id: true },
      })
    : await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
  if (!bootstrapTarget) return null;

  await prisma.user.update({
    where: { id: bootstrapTarget.id },
    data: { role: 'ADMIN' },
  });
  return bootstrapTarget.id;
};

module.exports = {
  AUTH_USER_SELECT,
  PUBLIC_AUTHOR_SELECT,
  HANDLE_RE,
  normalizeHandle,
  isValidHandle,
  isHandleReserved,
  findUserByHandle,
  buildUniqueHandle,
  ensureAdminBootstrap,
};
