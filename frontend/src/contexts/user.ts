import { createContext } from "react";
import type { User } from "../types/models";

export interface IUserContext {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const initialUserContext: IUserContext = {
    user: null,
    setUser: () => undefined
}

export const UserContext = createContext<IUserContext>(initialUserContext);