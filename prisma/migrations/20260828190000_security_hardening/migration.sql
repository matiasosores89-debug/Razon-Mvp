CREATE OR REPLACE FUNCTION prevent_active_appointment_overlap()
RETURNS trigger AS $$
BEGIN
  IF NEW."status" <> 'CANCELLED'::"AppointmentStatus" THEN
    -- Serialize writes for one barber so concurrent transactions cannot both pass.
    PERFORM pg_advisory_xact_lock(hashtext(NEW."barberId"));
    IF EXISTS (
      SELECT 1
      FROM "Appointment" existing
      WHERE existing."barberId" = NEW."barberId"
        AND existing."id" <> NEW."id"
        AND existing."status" <> 'CANCELLED'::"AppointmentStatus"
        AND existing."startTime" < NEW."endTime"
        AND existing."endTime" > NEW."startTime"
    ) THEN
      RAISE EXCEPTION 'active appointment overlaps an existing appointment'
        USING ERRCODE = '23P01', CONSTRAINT = 'Appointment_no_active_overlap';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Appointment_prevent_active_overlap" ON "Appointment";
CREATE TRIGGER "Appointment_prevent_active_overlap"
BEFORE INSERT OR UPDATE OF "barberId", "startTime", "endTime", "status"
ON "Appointment"
FOR EACH ROW EXECUTE FUNCTION prevent_active_appointment_overlap();
