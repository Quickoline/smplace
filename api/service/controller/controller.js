import {
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
} from "../services/services.js";
import { ROLES } from "../../../auth/roles.js";

function serviceAdminOwnsSerialized(service, req) {
  if (req.user?.role !== ROLES.SERVICE_ADMIN) return true;
  const owner = service.createdBy ? String(service.createdBy) : null;
  const sid = req.user?.id ?? req.user?._id;
  return owner && sid != null && owner === String(sid);
}

export const createServiceController = async (req, res) => {
  try {
    const {
      name,
      categoryId,
      subcategoryId,
      description,
      price,
      requirements,
      included,
      operationsAdminId,
    } = req.body;
    const service = await createService({
      name,
      categoryId,
      subcategoryId,
      description,
      price,
      requirements,
      included,
      operationsAdminId,
      userId: req.user?.id,
    });
    res.status(201).json({ message: "Service created", service });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listServicesController = async (req, res) => {
  try {
    const services = await listServices(req.user);
    res.status(200).json({ services: services ?? [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceController = async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!serviceAdminOwnsSerialized(service, req)) {
      return res.status(403).json({ message: "Not allowed to view this service" });
    }
    res.status(200).json({ service });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateServiceController = async (req, res) => {
  try {
    const existing = await getServiceById(req.params.id);
    if (!serviceAdminOwnsSerialized(existing, req)) {
      return res.status(403).json({ message: "Not allowed to update this service" });
    }
    const service = await updateService(req.params.id, req.body);
    res.status(200).json({ message: "Service updated", service });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteServiceController = async (req, res) => {
  try {
    const existing = await getServiceById(req.params.id);
    if (!serviceAdminOwnsSerialized(existing, req)) {
      return res.status(403).json({ message: "Not allowed to delete this service" });
    }
    await deleteService(req.params.id);
    res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
