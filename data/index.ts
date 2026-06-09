"use server"

import { createUserService } from "./users"
import { createUserRepository } from "./users/repo"
import db from "@/db"

export const { getUser, listUsers, createUser, deleteUser } = createUserService(
  createUserRepository(db)
)

export type { User, UserId } from "./users/model"
