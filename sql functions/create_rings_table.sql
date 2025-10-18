create table public.rings (
  date date null,
  mo_number character varying(30) null,
  vendor character varying(10) null,
  serial_number character varying(30) null,
  ring_size character varying(2) null,
  sku character varying(4) null,
  pcb character varying(3) null,
  qc_code character varying(5) null,
  qc_person character varying(40) null,
  vqc_status character varying(40) null,
  vqc_reason text null,
  ft_status character varying(40) null,
  ft_reason text null,
  constraint rings_serial_number_key unique (serial_number)
) TABLESPACE pg_default;

create index IF not exists idx_serial_number on public.rings using btree (serial_number) TABLESPACE pg_default;

create index IF not exists idx_vendor on public.rings using btree (vendor) TABLESPACE pg_default;

create index IF not exists idx_date_desc on public.rings using btree (date desc) TABLESPACE pg_default;

create index IF not exists idx_pcb on public.rings using btree (pcb) TABLESPACE pg_default;

create index IF not exists idx_qc_code on public.rings using btree (qc_code) TABLESPACE pg_default;

create index IF not exists idx_qc_person on public.rings using btree (qc_person) TABLESPACE pg_default;

create index IF not exists idx_rings_composite on public.rings using btree (vendor, vqc_status, ft_status) TABLESPACE pg_default;