create or replace function get_rejection_trends(
    p_date_from date,
    p_date_to date,
    p_vendor text,
    p_rejection_stage text
)
returns json as $$
declare
    v_rejection_data json;
    v_summary json;
    v_date_range date[];
    v_rejection_categories jsonb := '{
        "ASSEMBLY": ["BLACK GLUE", "ULTRAHUMAN TEXT SMUDGED", "WHITE PATCH ON BATTERY", "WHITE PATCH ON PCB", "WHITE PATCH ON BLACK TAPE", "WRONG RX COIL"],
        "CASTING": ["MICRO BUBBLES", "ALIGNMENT ISSUE", "DENT ON RESIN", "DUST INSIDE RESIN", "RESIN CURING ISSUE", "SHORT FILL OF RESIN", "SPM REJECTION", "TIGHT FIT FOR CHARGE", "LOOSE FITTING ON CHARGER", "RESIN SHRINKAGE", "WRONG MOULD", "GLOP TOP ISSUE"],
        "FUNCTIONAL": ["100% ISSUE", "3 SENSOR ISSUE", "BATTERY ISSUE", "BLUETOOTH HEIGHT ISSUE", "CE TAPE ISSUE", "CHARGING CODE ISSUE", "COIL THICKNESS ISSUE/BATTERY THICKNESS", "COMPONENT HEIGHT ISSUE", "CURRENT ISSUE", "DISCONNECTING ISSUE", "HRS BUBBLE", "HRS COATING HEIGHT ISSUE", "HRS DOUBLE LIGHT ISSUE", "HRS HEIGHT ISSUE", "NO NOTIFICATION IN CDT", "NOT ADVERTISING (WINGLESS PCB)", "NOT CHARGING", "SENSOR ISSUE", "STC ISSUE", "R&D REJECTION", "PRE NA", "POST NA"],
        "POLISHING": ["IMPROPER RESIN FINISH", "RESIN DAMAGE", "RX COIL SCRATCH", "SCRATCHES ON RESIN", "SIDE SCRATCH", "SIDE SCRATCH (EMERY)", "SHELL COATING REMOVED", "UNEVEN POLISHING", "WHITE PATCH ON SHELL AFTER POLISHING", "SCRATCHES ON SHELL"],
        "SHELL": ["BLACK MARKS ON SHELL", "DENT ON SHELL", "DISCOLORATION", "IRREGULAR SHELL SHAPE", "SHELL COATING ISSUE", "WHITE MARKS ON SHELL"]
    }';
begin
    -- 0. Define stage order
    create temp table if not exists stage_order (
        stage text primary key,
        seq serial
    );

    insert into stage_order (stage) values
        ('ASSEMBLY'),
        ('CASTING'),
        ('FUNCTIONAL'),
        ('POLISHING'),
        ('SHELL')
    on conflict do nothing;

    -- 1. Generate date range
    select array_agg(d::date)
    into v_date_range
    from generate_series(p_date_from, p_date_to, '1 day'::interval) d;

    -- 2. Create a temporary table for raw rejection records
    create temp table if not exists temp_rejection_records as
    select
        date,
        case
            when upper(trim(vqc_reason)) in ('PRE NA', 'POST NA') then 'NOT ADVERTISING (WINGLESS PCB)'
            else upper(trim(vqc_reason))
        end as reason
    from rings
    where
        date between p_date_from and p_date_to
        and vendor = p_vendor
        and p_rejection_stage in ('vqc', 'both')
        and vqc_status is not null and upper(vqc_status) not in ('ACCEPTED', 'PASS', '')
        and vqc_reason is not null and trim(vqc_reason) <> ''
    union all
    select
        date,
        case
            when upper(trim(ft_reason)) in ('PRE NA', 'POST NA') then 'NOT ADVERTISING (WINGLESS PCB)'
            else upper(trim(ft_reason))
        end as reason
    from rings
    where
        date between p_date_from and p_date_to
        and vendor = p_vendor
        and p_rejection_stage in ('ft', 'both')
        and ft_status is not null and upper(ft_status) not in ('ACCEPTED', 'PASS', '')
        and ft_reason is not null and trim(ft_reason) <> '';

    -- 3. Aggregate data
    with category_cte as (
        select
            j.key as stage,
            upper(e.value) as rejection_type,
            so.seq as stage_seq,
            e.n as rejection_seq
        from jsonb_each(v_rejection_categories) j
        join stage_order so on j.key = so.stage
        cross join lateral jsonb_array_elements_text(j.value) with ordinality as e(value, n)
    ),
    aggregated_data as (
        select
            c.stage,
            c.rejection_type,
            r.date,
            count(*) as daily_count
        from temp_rejection_records r
        join category_cte c on r.reason = c.rejection_type
        group by c.stage, c.rejection_type, r.date
    )
    select
        json_agg(
            json_build_object(
                'stage', t.stage,
                'rejection', t.rejection_type,
                'dateWiseData', t.date_wise_data,
                'totals', json_build_object('total', t.total_rejections)
            )
            order by t.stage_seq, t.rejection_seq
        )
    into v_rejection_data
    from (
        select
            c.stage,
            c.rejection_type,
            c.stage_seq,
            c.rejection_seq,
            json_object_agg(
                to_char(d.date, 'YYYY-MM-DD'),
                coalesce(a.daily_count, 0)
            ) as date_wise_data,
            sum(coalesce(a.daily_count, 0)) as total_rejections
        from category_cte c
        cross join unnest(v_date_range) as d(date)
        left join aggregated_data a on c.stage = a.stage and c.rejection_type = a.rejection_type and d.date = a.date
        group by c.stage, c.rejection_type, c.stage_seq, c.rejection_seq
    ) t;

    -- 4. Calculate summary
    with stage_wise as (
        select
            stage,
            sum((totals->>'total')::int) as stage_total
        from json_to_recordset(v_rejection_data) as x(stage text, totals json)
        group by stage
    )
    select
        json_build_object(
            'totalRejections', (select sum(stage_total) from stage_wise),
            'stageWiseTotals', (select json_object_agg(stage, stage_total) from stage_wise),
            'dateRange', to_json(v_date_range)
        )
    into v_summary;

    -- 5. Return final JSON
    return json_build_object(
        'rejectionData', v_rejection_data,
        'summary', v_summary
    );

    drop table temp_rejection_records;
    drop table stage_order;
end;
$$ language plpgsql;