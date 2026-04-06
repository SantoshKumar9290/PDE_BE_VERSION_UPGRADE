class Paginator {
    async paginate(req, callback, model, filterObject) {
        if(!model) {
            callback(new Error('No model found'));
        }

        const page = req.query ? parseInt(req.query.page || 1) : 1;
        const limit = req.query ? parseInt(req.query.limit || 10) :10;
        const skipIndex = (page - 1) * limit;
        const sortBy = req.query ? (req.query.sortBy || "_id") : "_id";
        const sortOrder = req.query ? parseInt(req.query.sortOrder || -1) :-1;
        const sortObject = {};
        const results = {
            page: page,
            limit: limit 
        };
        sortObject[sortBy] = sortOrder;

        const totalCount = model.find(filterObject).countDocuments();

        const result = model.find(filterObject)
            .sort(sortObject)
            .limit(limit)
            .skip(skipIndex)
            .exec();

        try {
            const [count, list] = await Promise.all([totalCount, result]);
            results.totalCount = count;
            results.list = list;

            callback(null, results);
        } catch(e) {
            callback(e);
        }
    }
}

module.exports = new Paginator();