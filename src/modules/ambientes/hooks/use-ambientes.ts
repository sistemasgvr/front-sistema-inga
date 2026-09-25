"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredUser } from "@/modules/auth/services/auth.service";
import * as api from "../services/ambientes.service";
import type {
  Feedback,
  GeometriaSalon,
  Mesa,
  Salon,
  SucursalAmbiente,
} from "../types/ambientes.types";

export function useAmbientes() {
  const [sucursales, setSucursales] = useState<SucursalAmbiente[]>([]);
  const [sucursalId, setSucursalId] = useState<number>(0);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);

  const error = useCallback(
    (e: unknown) =>
      setFeedback({
        variant: "error",
        title: "No se pudo completar",
        message:
          e instanceof Error ? e.message : "Ocurrió un error inesperado.",
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    const user = getStoredUser();
    if (!user?.es_super_admin && !user?.permisos?.includes("ambientes.listar"))
      return;
    api
      .listSucursalesAmbientes()
      .then((items) => {
        if (!active) return;
        setCanManage(
          Boolean(
            user?.es_super_admin ||
            user?.permisos?.includes("ambientes.gestionar"),
          ),
        );
        setSucursales(items);
        setSucursalId(
          Number(
            items.find(
              (s) => Number(s.id) === Number(user?.id_sucursal_default),
            )?.id ??
              items[0]?.id ??
              0,
          ),
        );
        if (!items.length) setLoading(false);
      })
      .catch((e) => {
        if (active) {
          error(e);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [error]);

  const reload = useCallback(async () => {
    if (!sucursalId) return;
    const current = ++generation.current;
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        api.listSalones(sucursalId),
        api.listMesas(sucursalId),
      ]);
      if (current === generation.current) {
        setSalones(s);
        setMesas(m);
      }
      return true;
    } catch (e) {
      if (current === generation.current) {
        setSalones([]);
        setMesas([]);
        error(e);
      }
      return false;
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [sucursalId, error]);

  const invalidate = useCallback(() => {
    generation.current++;
  }, []);
  useEffect(() => {
    // La consulta externa actualiza el indicador de carga antes de esperar la respuesta.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    return invalidate;
  }, [reload, invalidate]);

  async function mutate(action: () => Promise<unknown>): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      await action();
      const loaded = await reload();
      if (loaded)
        setFeedback({
          variant: "success",
          title: "Guardado",
          message: "Los cambios se guardaron correctamente.",
        });
      return true;
    } catch (e) {
      error(e);
      return false;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  async function moveSalon(id: number, geometry: GeometriaSalon) {
    if (pending.current) return;
    const before = salones;
    setSalones((items) =>
      items.map((s) => (Number(s.id) === id ? { ...s, ...geometry } : s)),
    );
    pending.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      const saved = await api.saveGeometria(id, geometry);
      setSalones((items) =>
        items.map((s) => (Number(s.id) === id ? saved : s)),
      );
    } catch (e) {
      setSalones(before);
      error(e);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  function changeSucursal(id: number) {
    if (pending.current || id === sucursalId) return;
    generation.current++;
    setSalones([]);
    setMesas([]);
    setLoading(true);
    setSucursalId(id);
  }

  return {
    sucursales,
    sucursalId,
    changeSucursal,
    salones,
    mesas,
    loading,
    saving,
    canManage,
    feedback,
    error,
    reload,
    mutate,
    moveSalon,
  };
}
