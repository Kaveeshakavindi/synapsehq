from owlready2 import *

def get_ontology_info(onto):
    with onto:
        sync_reasoner_hermit(infer_property_values=True)
    info = "Ontology Information:\n"

    # Classes and Subclasses with Descriptions
    info += "\nClasses and Subclasses:\n"
    processed_subclasses = set()  # To avoid repetition
    for cls in onto.classes():
        info += f"- {cls.name} class:\n"
        if cls.comment:
            info += f"  - Description: {cls.comment[0]}\n"  # Include class description if available
        for subcls in cls.subclasses():
            if subcls not in processed_subclasses:  # Avoid printing duplicates
                info += f"  - Subclass: {subcls.name}\n"
                if subcls.comment:
                    info += f"    - Description: {subcls.comment[0]}\n"
                processed_subclasses.add(subcls)

    # Instances with Types and Descriptions
    info += "\nInstances:\n"
    for instance in onto.individuals():
        info += f"- {instance.name}: Instance of {instance.is_a[0].name}\n"
        if instance.comment:
            info += f"  - Description: {instance.comment[0]}\n" 

    # Object Properties (Relationships) without duplication
    info += "\nObject Properties (Relationships):\n"
    processed_props = set()  # To avoid repetition of properties
    if onto.object_properties():  # Check if there are any object properties
        for prop in onto.object_properties():
            if prop not in processed_props:  # Avoid duplicate property entries
                info += f"- {prop.name}:\n"
                if prop.comment:
                    info += f"  - Description: {prop.comment[0]}\n"
                # Avoid duplicate domains and ranges
                unique_domains = set(prop.domain)
                unique_ranges = set(prop.range)
                for domain in unique_domains:
                    info += f"  - Domain: {domain.name}\n"
                for range in unique_ranges:
                    info += f"  - Range: {range.name}\n"
                processed_props.add(prop)
    else:
        info += "  - No object properties defined in the ontology.\n"

    # Logical Statements (explicit relationships like CausesFailure) without duplication
    info += "\nLogical Statements (Relationships between instances):\n"
    processed_statements = set()  # To avoid repetition of statements
    statements_found = False  # Flag to track if any statements are found
    for prop in onto.object_properties():
        for s, o in prop.get_relations():
            statement = f"{s.name}.{prop.name}({o.name})"
            if statement not in processed_statements:  # Avoid duplicates
                info += statement + "\n"
                processed_statements.add(statement)
                statements_found = True
    if not statements_found:
        info += "  - No logical statements (relationships between instances) defined in the ontology.\n"
    

    # Author : Kaveesha Fernando
    # Date : 07/12/2025
    # SWRL Rules (improved existing code with swrl rules)
    info += "\nSWRL Rules:\n"
    if onto.rules():
        for rule in onto.rules():
            info += f"- {rule.label[0] if rule.label else rule.name}: {rule.comment[0] if rule.comment else ''}\n"
    else:
        info += "  - No SWRL rules defined.\n"
    

    
    
    return info