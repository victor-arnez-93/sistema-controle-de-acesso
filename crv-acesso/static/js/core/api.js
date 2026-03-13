/* ==========================================================
   API CRV - SUPABASE
   ========================================================== */

async function listarFuncionarios(){

    const { data, error } =
        await window.sb
            .from("funcionarios")
            .select("*")
            .order("nome");

    if(error){
        console.error(error);
        return [];
    }

    return data;

}

async function criarFuncionario(payload){

    const { error } =
        await window.sb
            .from("funcionarios")
            .insert(payload);

    if(error){
        console.error(error);
        return false;
    }

    return true;

}

async function atualizarFuncionario(id, payload){

    const { error } =
        await window.sb
            .from("funcionarios")
            .update(payload)
            .eq("id", id);

    if(error){
        console.error(error);
        return false;
    }

    return true;

}

window.apiCRV = {
    listarFuncionarios,
    criarFuncionario,
    atualizarFuncionario
};